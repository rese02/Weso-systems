
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// This is a "Singleton" pattern. It ensures that the Firebase Admin SDK is initialized only once,
// preventing errors during hot-reloads in development.
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. This is required for server-side operations.');
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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
const storageAdmin = getStorage();


/**
 * Verifies the session cookie.
 * @param session - The session cookie string.
 * @returns The decoded token, or null if invalid.
 */
export async function verifyAuth(session?: string): Promise<DecodedIdToken | null> {
    if (!session) {
        return null;
    }
    try {
        // Use verifySessionCookie for session management, it's the counterpart to createSessionCookie
        const decodedToken = await authAdmin.verifySessionCookie(session, true /** checkRevoked */);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying session cookie:', error);
        return null;
    }
}


export { authAdmin, dbAdmin, storageAdmin };
