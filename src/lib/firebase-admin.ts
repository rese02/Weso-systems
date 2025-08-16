import admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. This is required for server-side operations.');
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    const err = error as Error;
    console.error('Firebase Admin initialization error:', err.message);
    throw new Error('Failed to initialize Firebase Admin SDK. Check your service account key. It might be malformed or missing.');
  }
}

const authAdmin = admin.auth();
const dbAdmin = admin.firestore();

export { authAdmin, dbAdmin };
