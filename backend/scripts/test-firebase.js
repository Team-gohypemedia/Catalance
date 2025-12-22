
// scripts/test-firebase.js
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("🔍 Testing Firebase Configuration...");

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing in .env");
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(serviceAccountKey);
  console.log("✅ Service Account Key JSON is valid.");
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin Initialized successfully.");

} catch (error) {
  console.error("❌ Failed to parse SERVICE_ACCOUNT_KEY or Initialize App:", error.message);
  process.exit(1);
}

// Dry run message to test permissions
const message = {
  token: "test-token", // This will fail but valid config will catch it as 'invalid-token' not 'unauthorized'
  notification: {
    title: "Test",
    body: "Test"
  }
};

admin.messaging().send(message, true) // dryRun = true
  .then((response) => {
    console.log("✅ detailed verify success:", response);
  })
  .catch((error) => {
    if (error.code === 'messaging/invalid-registration-token') {
      console.log("✅ Firebase connection works! (Caught expected invalid token error)");
    } else {
      console.error("❌ Firebase Messaging Error:", error.code, error.message);
    }
  });

