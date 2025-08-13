'use server';

import { authAdmin } from '@/lib/firebase-admin';

// THIS IS A TEMPORARY ACTION FOR DEBUGGING AND SHOULD BE REMOVED AFTER USE

const USER_UID = '447umxYFvIRrwU0ogMDYU5Ednyq2'; // UID for hallo@agentur-weso.it
const NEW_PASSWORD = 'Hallo-weso.2025!';

/**
 * Resets the password for a specific user and ensures they have the correct custom claim.
 * This is a secure, server-side operation.
 */
export async function resetAgencyPassword() {
  console.log(`Attempting to update user and set claims for UID: ${USER_UID}`);
  try {
    // Step 1: Set the custom claim for the user to identify them as an agency owner.
    await authAdmin.setCustomUserClaims(USER_UID, { role: 'agency-owner' });
    console.log(`Successfully set 'agency-owner' claim for UID: ${USER_UID}`);
    
    // Step 2: Update the user's password.
    await authAdmin.updateUser(USER_UID, {
      password: NEW_PASSWORD,
    });
    console.log(`Successfully reset password for UID: ${USER_UID}`);
    
    return { success: true, message: 'Password and claims have been set successfully.' };
  } catch (error: any) {
    console.error('Error updating user:', error.message);
    return { success: false, error: error.message };
  }
}
