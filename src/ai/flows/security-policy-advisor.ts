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
    .array(z.string())
    .describe('The frameworks used in the application (e.g., NextJS, Firebase).'),
  architectureDescription: z
    .string()
    .describe('A detailed description of the application architecture, including data flow, authentication methods, and database structure.'),
});
export type SecurityPolicyInput = z.infer<typeof SecurityPolicyInputSchema>;

const SecurityPolicyOutputSchema = z.object({
  policy: z.string().describe('The generated security policy document in Markdown format. This should cover data handling, access control, incident response, etc.'),
  recommendations: z
    .string()
    .describe('A report of specific, actionable security recommendations in Markdown format. This should include code examples or configuration changes to mitigate vulnerabilities like XSS, CSRF, insecure direct object references, and Firebase-specific security rules.'),
});
export type SecurityPolicyOutput = z.infer<typeof SecurityPolicyOutputSchema>;

export async function generateSecurityPolicy(
  input: SecurityPolicyInput
): Promise<SecurityPolicyOutput> {
  return securityPolicyFlow(input);
}

const securityPolicyFlow = ai.defineFlow(
  {
    name: 'securityPolicyFlow',
    inputSchema: SecurityPolicyInputSchema,
    outputSchema: SecurityPolicyOutputSchema,
  },
  async ({ frameworks, architectureDescription }) => {
    
    const prompt = `
      You are a world-class cybersecurity expert specializing in web applications built with Next.js and Firebase.
      Your task is to generate a comprehensive security policy and a set of actionable recommendations based on the provided architecture.

      **Context:**
      - **Frameworks:** ${frameworks.join(', ')}
      - **Architecture Description:** ${architectureDescription}

      **Instructions:**

      **Part 1: Security Policy**
      Generate a formal security policy in Markdown format. It should be professional and well-structured. Cover the following sections:
        1.  **Introduction:** Purpose of the policy.
        2.  **Data Classification:** Define sensitivity levels (e.g., Public, Internal, Confidential, Restricted) and classify the data mentioned in the architecture (guest PII, booking details, payment proofs, etc.).
        3.  **Access Control:** Policy for user authentication, role-based access control (RBAC) for agency, hotelier, and guest roles. Mention principles like least privilege.
        4.  **Data Protection:** Encryption at rest and in transit. Secure data handling procedures for guest documents and payment information.
        5.  **Secure Development:** Guidelines for developers (e.g., input validation, output encoding, secure dependencies).
        6.  **Incident Response:** Basic plan for identifying, containing, and reporting a security breach.
        7.  **Compliance:** Mention relevant regulations if applicable (e.g., GDPR for European guest data).

      **Part 2: Actionable Recommendations Report**
      Generate a separate, clear, and actionable report of security recommendations in Markdown format. For each recommendation, provide a title, a brief explanation of the risk, and a concrete example of how to implement the fix within the specified tech stack. Address at least the following vulnerabilities:
        1.  **Firebase Security Rules:** Provide robust Firestore rules for the `hotels` and `bookings` collections that enforce the described access control (e.g., only authenticated agency owners can create hotels, only the correct hotelier can read their bookings).
        2.  **Firebase Storage Security:** Provide secure rules for Firebase Storage to ensure only authenticated and authorized users can upload/download documents for their specific booking.
        3.  **Next.js Server Action Security:** How to prevent Cross-Site Request Forgery (CSRF) and ensure only authenticated/authorized users can execute sensitive server actions.
        4.  **Input Validation & Output Encoding:** Show how to use a library like Zod for strict server-side input validation on forms and server actions to prevent injection attacks. Explain the importance of avoiding `dangerouslySetInnerHTML` in React to prevent XSS.
        5.  **Dependency Management:** Recommend tools like `npm audit` or Dependabot to keep dependencies secure.
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      output: {
        schema: SecurityPolicyOutputSchema,
      },
      model: 'googleai/gemini-2.0-flash',
    });
    
    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to generate security policy from the model.');
    }

    return output;
  }
);

    