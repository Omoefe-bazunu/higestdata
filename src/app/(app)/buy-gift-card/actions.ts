"use server";

import { z } from "zod";

const formSchema = z.object({
  brand: z.string().min(1, { message: "Please select a brand." }),
  amount: z.coerce.number().positive({ message: "Please select an amount." }),
});

export async function buyGiftCard(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }

  const { brand, amount } = validatedInput.data;
  
  // TODO: Implement Gift Card Purchase Logic
  // 1. Check your inventory for an available gift card of the selected brand and amount.
  //    - This requires an admin panel where you manage your gift card inventory.
  // 2. Check the user's wallet balance.
  // 3. Deduct the amount from the user's wallet.
  // 4. Dispense the gift card code to the user.
  //    - Securely display it on the frontend or email it.
  // 5. Update your inventory and log the transaction.

  console.log("Simulating gift card purchase:", validatedInput.data);

  // Simulate a successful API call
  return { 
    success: true, 
    data: { 
      message: `Successfully purchased a $${amount} ${brand} gift card. The code has been sent to your email.`
    } 
  };
}
