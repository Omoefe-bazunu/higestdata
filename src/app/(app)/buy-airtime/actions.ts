
"use server";

import { z } from "zod";

const formSchema = z.object({
  serviceId: z.string().min(1, { message: "Please select a network." }),
  phoneNumber: z.string().regex(/^0[789][01]\d{8}$/, { message: "Please enter a valid Nigerian phone number." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
});

export async function buyAirtime(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  
  const { serviceId, phoneNumber, amount } = validatedInput.data;

  // TODO: Implement VTPass API call here.
  // This function should:
  // 1. Make the payment request to the VTPass Pay endpoint for airtime.
  //    - https://www.vtpass.com/documentation/airtime-2/
  // 2. Handle the response, checking for success or failure.
  // 3. Return a meaningful response to the client.

  console.log("Simulating airtime purchase with VTPass for:", { serviceId, phoneNumber, amount });

  // Mock response based on input
  if (amount < 50) {
      return { success: false, error: "Minimum airtime purchase is ₦50." };
  }

  // Simulate a successful API call
  return { 
    success: true, 
    data: { 
      transactionId: `VT-AIRTIME-${Math.random().toString(36).substring(2, 9)}`,
      details: `Successfully purchased ₦${amount} airtime for ${phoneNumber}.`
    } 
  };
}
