
import admin from 'firebase-admin';

// This function ensures Firebase Admin is initialized only once.
async function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. This is required for server-side operations.');
    }
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
      });
    } catch (error) {
      console.error('Firebase Admin initialization error:', (error as Error).message);
      throw new Error('Failed to initialize Firebase Admin SDK. Check your service account key.');
    }
  }
}

// A helper function to get the initialized admin instances.
export async function getFirebaseAdmin() {
  await initializeFirebaseAdmin();
  return {
    authAdmin: admin.auth(),
    dbAdmin: admin.firestore(),
  };
}

// For direct use in simple scripts, ensuring initialization first.
const adminPromise = initializeFirebaseAdmin().then(() => ({
  authAdmin: admin.auth(),
  dbAdmin: admin.firestore(),
}));

export const { authAdmin, dbAdmin } = await adminPromise;
