'use server';

import { authAdmin } from '@/lib/firebase-admin';

// THIS IS A TEMPORARY ACTION FOR DEBUGGING AND SHOULD BE REMOVED AFTER USE

const USER_UID = '447umxYFvIRrwU0ogMDYU5Ednyq2'; // UID for hallo@agentur-weso.it
const NEW_PASSWORD = 'Hallo-weso.2025!';

/**
 * Resets the password for a specific user using the Firebase Admin SDK.
 * This is a secure, server-side operation.
 */
export async function resetAgencyPassword() {
  console.log(`Attempting to reset password for UID: ${USER_UID}`);
  try {
    await authAdmin.updateUser(USER_UID, {
      password: NEW_PASSWORD,
    });
    console.log(`Successfully reset password for UID: ${USER_UID}`);
    return { success: true, message: 'Password has been reset successfully.' };
  } catch (error: any) {
    console.error('Error resetting password:', error.message);
    return { success: false, error: error.message };
  }
}
