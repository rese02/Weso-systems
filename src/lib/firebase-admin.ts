import admin from 'firebase-admin';

// This is a safeguard to prevent re-initializing the app on hot reloads.
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', (error as Error).message);
  }
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
