"use server";

import { z } from "zod";

const formSchema = z.object({
  crypto: z.string().min(1, { message: "Please select a cryptocurrency." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
});

export async function sellCrypto(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  
  const { crypto, amount } = validatedInput.data;

  // TODO: Implement Binance API integration here.
  // 1. Check user's crypto balance for the selected asset.
  // 2. Get the current price of the selected crypto from Binance API.
  //    - You will apply a spread here (buy from user at a slightly lower rate).
  // 3. Calculate the amount of cash the user will receive.
  // 4. Execute the trade on Binance via their API (sell user's crypto).
  // 5. On success, credit the user's fiat wallet with the proceeds.
  // 6. Store the transaction details in your database.

  console.log("Simulating crypto sale:", validatedInput.data);

  // Simulate a successful API call
  return { 
    success: true, 
    data: { 
      message: `Successfully initiated sale of ${amount} ${crypto.toUpperCase()}.`
    } 
  };
}
