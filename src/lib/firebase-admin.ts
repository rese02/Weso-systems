
'use server';

import admin from 'firebase-admin';

// This function ensures Firebase Admin is initialized only once in a more robust way.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
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

// A helper function to get the initialized admin instances.
// Call this function in your server actions before using authAdmin or dbAdmin.
export function getFirebaseAdmin() {
  initializeFirebaseAdmin();
  return {
    authAdmin: admin.auth(),
    dbAdmin: admin.firestore(),
  };
}
