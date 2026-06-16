import admin from 'firebase-admin';

async function main() {
  const email = 'assuredrewardsofficial@gmail.com';
  
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountStr) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountStr)),
        projectId: process.env.FIREBASE_PROJECT_ID || 'catalance-4dc1b',
      });
    } else {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'catalance-4dc1b' });
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    if (userRecord) {
      await admin.auth().deleteUser(userRecord.uid);
      console.log('Successfully deleted user from Firebase:', userRecord.uid);
    }
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('User not found in Firebase.');
    } else {
      console.log('Error deleting from firebase:', error);
    }
  }
}

main().catch(console.error);
