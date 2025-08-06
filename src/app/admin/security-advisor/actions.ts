// @ts-nocheck
'use server';

import {
  generateSecurityPolicy,
  type SecurityPolicyOutput,
} from '@/ai/flows/security-policy-advisor';
import { z } from 'zod';

const FormSchema = z.object({
  architectureDescription: z
    .string()
    .min(10, { message: 'Please provide a more detailed description.' }),
});

export type State = {
  data?: SecurityPolicyOutput | null;
  error?: string | null;
  message?: string;
};

export async function getSecurityPolicy(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = FormSchema.safeParse({
    architectureDescription: formData.get('architectureDescription'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.architectureDescription?.[0],
    };
  }

  try {
    const result = await generateSecurityPolicy({
      frameworks: ['NextJS', 'Firebase'],
      architectureDescription: validatedFields.data.architectureDescription,
    });
    return { data: result, message: 'Successfully generated security policy.' };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      error: error.message || 'An unknown error occurred.',
    };
  }
}
