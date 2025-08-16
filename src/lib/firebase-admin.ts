
import admin from 'firebase-admin';

// This function ensures Firebase Admin is initialized only once in a more robust way.
function initializeFirebaseAdmin() {
  // Check if the app is already initialized to prevent re-initialization
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Reading the service account key from environment variables
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. This is required for server-side operations.');
  }
  
  try {
    // Initialize the Firebase Admin SDK
    const app = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
    });
    console.log("Firebase Admin SDK initialized successfully.");
    return app;
  } catch (error) {
    const err = error as Error;
    console.error('Firebase Admin initialization error:', err.message);
    throw new Error('Failed to initialize Firebase Admin SDK. Check your service account key. It might be malformed or missing.');
  }
}

// A helper function to get the initialized admin instances.
// Call this function in your server actions before using authAdmin or dbAdmin.
export function getFirebaseAdmin() {
  initializeFirebaseAdmin();
  return {
    authAdmin: admin.auth(),
    dbAdmin: admin.firestore(),
  };
}
