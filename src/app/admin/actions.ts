"use server";

import { z } from "zod";

const formSchema = z.object({
    btcBuySpread: z.coerce.number(),
    btcSellSpread: z.coerce.number(),
    giftCardBuyRate: z.coerce.number().min(0).max(1),
});

export async function updateRates(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }

  // TODO: Implement database logic here
  // 1. Ensure the current user is an admin. You can get this from the session.
  // 2. Save the validatedInput.data to your database (e.g., a 'settings' collection in Firestore).
  
  console.log("Simulating updating rates in database:", validatedInput.data);

  // Simulate a successful API call
  return { 
    success: true, 
    data: { 
      message: "Rates updated successfully."
    } 
  };
}
