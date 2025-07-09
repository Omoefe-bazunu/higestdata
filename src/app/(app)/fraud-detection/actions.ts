"use server";

import { detectFraud } from "@/ai/flows/detect-fraud";
import { z } from "zod";

const formSchema = z.object({
  transactionAmount: z.number(),
  userProfile: z.string(),
  transactionHistory: z.string(),
});

export async function runFraudDetection(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    console.error("Invalid input:", validatedInput.error);
    return null;
  }

  try {
    const result = await detectFraud(validatedInput.data);
    return result;
  } catch (error) {
    console.error("Error running fraud detection flow:", error);
    return null;
  }
}
