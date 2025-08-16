// This is a temporary, one-time-use server action to create the first agency owner.
// Run this from your terminal using a tool like tsx: `tsx src/lib/actions/temp-create-agency-owner.ts`
// After running it once successfully, you can delete this file.

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

async function createAgencyOwner() {
  console.log('Attempting to create or configure the agency owner...');

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY is not set in your .env file.');
    console.error('Please ensure your .env file is correctly set up with the service account JSON.');
    return;
  }

  // Correctly initialize the app if it hasn't been already
  if (!admin.apps.length) {
    try {
      console.log('Initializing Firebase Admin SDK...');
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
      });
       console.log('Firebase Admin SDK initialized successfully.');
    } catch (e) {
      console.error('Firebase Admin SDK initialization error:', e);
      return;
    }
  } else {
     console.log('Firebase Admin SDK already initialized.');
  }


  const authAdmin = getAuth();

  // --- Define the agency owner credentials ---
  const agencyEmail = 'hallo@agentur-weso.it';
  const agencyPassword = 'Hallo-weso.2025!';
  // -----------------------------------------

  try {
    // Check if the user already exists
    let user;
    try {
      user = await authAdmin.getUserByEmail(agencyEmail);
      console.log(`User ${agencyEmail} already exists. UID: ${user.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User does not exist, so create them
        console.log(`User ${agencyEmail} not found, creating new user...`);
        user = await authAdmin.createUser({
          email: agencyEmail,
          password: agencyPassword,
          emailVerified: true, // For simplicity in this setup
          displayName: 'Weso Systems Admin',
        });
        console.log(`Successfully created new user: ${user.uid}`);
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Set the custom claim for the user
    await authAdmin.setCustomUserClaims(user.uid, { role: 'agency' });
    console.log(`Successfully set custom claim 'role: agency' for user ${user.uid}.`);
    console.log('\n✅ Setup complete! You can now log in.');
    console.log(`   Email: ${agencyEmail}`);
    console.log(`   Password: [your password]`);

  } catch (error) {
    console.error('An error occurred during the setup process:');
    console.error(error);
  }
}

// Execute the function
createAgencyOwner();
