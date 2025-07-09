// src/ai/flows/detect-fraud.ts
'use server';
/**
 * @fileOverview An AI agent for detecting fraudulent transactions.
 *
 * - detectFraud - A function that handles the fraud detection process.
 * - DetectFraudInput - The input type for the detectFraud function.
 * - DetectFraudOutput - The return type for the detectFraud function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectFraudInputSchema = z.object({
  transactionHistory: z
    .string()
    .describe('The transaction history of the user.'),
  transactionAmount: z.number().describe('The amount of the transaction.'),
  userProfile: z.string().describe('The user profile information.'),
});
export type DetectFraudInput = z.infer<typeof DetectFraudInputSchema>;

const DetectFraudOutputSchema = z.object({
  isFraudulent: z.boolean().describe('Whether the transaction is fraudulent.'),
  fraudExplanation: z
    .string()
    .describe('The explanation of why the transaction is fraudulent.'),
});
export type DetectFraudOutput = z.infer<typeof DetectFraudOutputSchema>;

export async function detectFraud(input: DetectFraudInput): Promise<DetectFraudOutput> {
  return detectFraudFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectFraudPrompt',
  input: {schema: DetectFraudInputSchema},
  output: {schema: DetectFraudOutputSchema},
  prompt: `You are an expert in fraud detection for financial transactions.

You are given the transaction history, transaction amount, and user profile of a user.

Based on this information, you must determine if the transaction is fraudulent or not.

Transaction History: {{{transactionHistory}}}
Transaction Amount: {{{transactionAmount}}}
User Profile: {{{userProfile}}}

Consider the following:

- Abnormally large transaction amounts compared to the user's typical transactions.
- Transactions to or from blacklisted accounts.
- Unusual transaction patterns.
- Suspicious user behavior.

Output whether the transaction is fraudulent (isFraudulent) and provide a detailed explanation (fraudExplanation).
`,
});

const detectFraudFlow = ai.defineFlow(
  {
    name: 'detectFraudFlow',
    inputSchema: DetectFraudInputSchema,
    outputSchema: DetectFraudOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

