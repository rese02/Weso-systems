
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * This is a temporary server action used to ensure the primary agency
 * user has the correct password and custom claims (`agency-owner`).
 * This is necessary to fix potential state inconsistencies during development.
 * It's designed to be safely run multiple times.
 */
export async function resetAgencyPassword() {
  console.log("Attempting to reset agency user password and claims...");
  try {
    const { authAdmin } = getFirebaseAdmin();
    const email = 'hallo@agentur-weso.it';
    const password = 'Hallo-weso.2025!';
    const uid = '447umxYFvIRrwU0ogMDYU5Ednyq2';

    // Set custom claims to ensure the user has the 'agency-owner' role.
    await authAdmin.setCustomUserClaims(uid, { role: 'agency-owner' });
    console.log(`Successfully set 'agency-owner' claim for user ${uid}.`);

    // Update the user's password to the known correct value.
    await authAdmin.updateUser(uid, {
      password: password,
    });
    console.log(`Successfully updated password for user ${uid}.`);

    return { success: true, message: "Agency user password and claims have been reset." };
  } catch (error) {
    const err = error as Error;
    console.error("Failed to reset agency user password and claims:", err.message);
    // We don't throw an error here to prevent crashing the app if something goes wrong
    // (e.g., during initial setup before Firebase Admin is configured).
    return { success: false, error: err.message };
  }
}
