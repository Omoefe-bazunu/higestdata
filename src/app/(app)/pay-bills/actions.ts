
"use server";

import { z } from "zod";

const formSchema = z.object({
  serviceId: z.string().min(1, { message: "Please select a service." }),
  customerId: z.string().min(1, { message: "Customer ID is required." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }).optional(),
  variationCode: z.string().min(1, { message: "Please select a plan." }).optional(),
});

export async function payBill(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  
  const { serviceId, customerId, amount, variationCode } = validatedInput.data;

  // TODO: Implement VTPass API call here.
  // This function should:
  // 1. (Optional) Verify the customer ID using the VTPass Merchant-Verify endpoint.
  //    - https://www.vtpass.com/documentation/merchant-verify/
  // 2. Make the payment request to the VTPass Pay endpoint.
  //    - https://www.vtpass.com/documentation/pay/
  // 3. Handle the response, checking for success or failure.
  // 4. Return a meaningful response to the client.

  console.log("Simulating bill payment with VTPass for:", { serviceId, customerId, amount, variationCode });

  // Mock response based on input
  if (customerId.length < 10) {
      return { success: false, error: "Invalid customer ID provided." };
  }

  // Simulate a successful API call
  return { 
    success: true, 
    data: { 
      transactionId: `VT-BILL-${Math.random().toString(36).substring(2, 9)}`,
      details: `Successfully paid bill for ${serviceId}.`
    } 
  };
}
