
"use server";

import { z } from "zod";

const formSchema = z.object({
  network: z.string().min(1, { message: "Please select a network." }),
  phoneNumber: z.string().regex(/^0[789][01]\d{8}$/, { message: "Please enter a valid Nigerian phone number." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
});

export async function convertAirtimeToCash(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }

  // TODO: Implement Airtime to Cash API call here.
  // VTPass does not offer a direct airtime-to-cash API.
  // This would typically be a third-party service.
  // 1. Make the API call to your chosen airtime-to-cash provider.
  // 2. This usually involves the user transferring airtime to a specific number.
  //    Your service would then confirm receipt and credit the user's wallet.
  // 3. Handle the response and return a status to the client.
  
  console.log("Simulating airtime to cash conversion for:", validatedInput.data);

  // Simulate a successful API call
  return { 
    success: true, 
    data: { 
      message: "Instructions to complete the transfer have been sent to your phone."
    } 
  };
}
