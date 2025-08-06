'use server';

/**
 * @fileOverview Generates a security policy tailored to NextJS and Firebase to protect against common and novel exploits.
 *
 * - generateSecurityPolicy - A function that generates a security policy.
 * - SecurityPolicyInput - The input type for the generateSecurityPolicy function.
 * - SecurityPolicyOutput - The return type for the generateSecurityPolicy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SecurityPolicyInputSchema = z.object({
  frameworks: z
    .array(z.enum(['NextJS', 'Firebase']))
    .describe('The frameworks used in the application (NextJS, Firebase).'),
  architectureDescription: z
    .string()
    .describe('A detailed description of the application architecture.'),
});
export type SecurityPolicyInput = z.infer<typeof SecurityPolicyInputSchema>;

const SecurityPolicyOutputSchema = z.object({
  policy: z.string().describe('The generated security policy.'),
  recommendations: z
    .string()
    .describe('A report of security recommendations.'),
});
export type SecurityPolicyOutput = z.infer<typeof SecurityPolicyOutputSchema>;

export async function generateSecurityPolicy(
  input: SecurityPolicyInput
): Promise<SecurityPolicyOutput> {
  return securityPolicyFlow(input);
}

const securityPolicyPrompt = ai.definePrompt({
  name: 'securityPolicyPrompt',
  input: {schema: SecurityPolicyInputSchema},
  output: {schema: SecurityPolicyOutputSchema},
  prompt: `You are a security expert specializing in NextJS and Firebase applications.

You will generate a comprehensive security policy and a report of recommendations based on the selected frameworks and the provided architecture description. The policy should address common and novel exploits.

Frameworks: {{frameworks}}
Architecture Description: {{{architectureDescription}}}

Security Policy:
{{policy}}

Recommendations:
{{recommendations}}`,
});

const securityPolicyFlow = ai.defineFlow(
  {
    name: 'securityPolicyFlow',
    inputSchema: SecurityPolicyInputSchema,
    outputSchema: SecurityPolicyOutputSchema,
  },
  async input => {
    const {output} = await securityPolicyPrompt(input);
    return output!;
  }
);
