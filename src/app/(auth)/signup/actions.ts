'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const SignupSchema = z.object({
  agencyName: z.string().min(2, { message: 'Agency name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export type State = {
  success: boolean;
  error: string | null;
};

export async function createAgency(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = SignupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors.email?.[0]
      || validatedFields.error.flatten().fieldErrors.password?.[0]
      || validatedFields.error.flatten().fieldErrors.agencyName?.[0]
      || 'Invalid data provided.';
    return { success: false, error: errorMessage };
  }

  const { agencyName, email, password } = validatedFields.data;

  try {
    const { authAdmin, dbAdmin } = await getFirebaseAdmin();
    
    // Check if user already exists
    try {
        await authAdmin.getUserByEmail(email);
        return { success: false, error: 'An account with this email already exists.' };
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error; // Re-throw other errors
        }
        // If user not found, we can proceed
    }

    // Create user in Firebase Auth
    const userRecord = await authAdmin.createUser({
      email,
      password,
      displayName: agencyName,
    });

    // Set custom claim for agency owner role
    await authAdmin.setCustomUserClaims(userRecord.uid, { role: 'agency-owner' });

    // Create agency document in Firestore
    await addDoc(collection(dbAdmin, 'agencies'), {
      name: agencyName,
      ownerUid: userRecord.uid,
      createdAt: Timestamp.now(),
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Agency creation failed:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'An account with this email already exists.';
    }
    return { success: false, error: errorMessage };
  }
}
