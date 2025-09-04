"use server";
/**
 * @fileOverview A flow that flags potentially fraudulent gift card uploads for admin review.
 *
 * - flagGiftCardForFraud - A function that flags gift card uploads as potentially fraudulent.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const FlagGiftCardForFraudInputSchema = z.object({
  giftCardDetails: z
    .string()
    .describe(
      "Details of the gift card upload including value, recipient, and sender information."
    ),
  userTransactionHistory: z.string().describe("The user transaction history."),
  uploadMetadata: z
    .string()
    .describe(
      "Metadata about the upload, such as IP address, time of day, and device information."
    ),
});

const FlagGiftCardForFraudOutputSchema = z.object({
  isFraudulent: z
    .boolean()
    .describe("Whether the gift card upload is potentially fraudulent."),
  fraudExplanation: z
    .string()
    .describe(
      "Explanation of why the gift card upload is potentially fraudulent."
    ),
});

export async function flagGiftCardForFraud(input) {
  return flagGiftCardForFraudFlow(input);
}

const prompt = ai.definePrompt({
  name: "flagGiftCardForFraudPrompt",
  input: { schema: FlagGiftCardForFraudInputSchema },
  output: { schema: FlagGiftCardForFraudOutputSchema },
  prompt: `You are an expert fraud detection specialist.

You will be provided with details of a gift card upload, the user's transaction history, and upload metadata. You will use this information to determine if the gift card upload is potentially fraudulent.

Gift Card Details: {{{giftCardDetails}}}
User Transaction History: {{{userTransactionHistory}}}
Upload Metadata: {{{uploadMetadata}}}

Based on the information provided, determine if the gift card upload is potentially fraudulent. If it is, explain why.
Set the isFraudulent output field appropriately.
`,
});

const flagGiftCardForFraudFlow = ai.defineFlow(
  {
    name: "flagGiftCardForFraudFlow",
    inputSchema: FlagGiftCardForFraudInputSchema,
    outputSchema: FlagGiftCardForFraudOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output;
  }
);
